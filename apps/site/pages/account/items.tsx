import { Container } from '@components/Container'
import type { APIGuildMember, RESTGetAPIGuildMembersSearchResult } from '@discordjs/core'
import { getDefaultLayout } from '@lib/getDefaultLayout'
import type { Database, Json } from '@lib/supabase-types'
import { getArray, getSingle } from '@lib/supabase-utils'
import { Search } from '@tamagui/lucide-icons'
import { UserGuard, useUser } from 'hooks/useUser'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { DiscordChannelStatus } from 'pages/api/discord/channel'
import { useState } from 'react'
import useSWR, { mutate, useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'
import {
  Avatar,
  Button,
  Fieldset,
  Form,
  H2,
  H3,
  H4,
  Image,
  Input,
  Label,
  Paragraph,
  Separator,
  SizableText,
  Spinner,
  XStack,
  YStack,
} from 'tamagui'

import { ButtonLink } from '../../components/Link'
import { NextLink } from '../../components/NextLink'
import { Notice } from '../../components/Notice'
import type { UserContextType } from 'pages/api/user'

export default function Page() {
  return (
    <>
      <NextSeo title="Items — Tamagui" description="A better universal UI system." />

      <UserGuard>
        <Items />
      </UserGuard>
    </>
  )
}

const Items = () => {
  const { data, isLoading } = useUser()

  if (isLoading || !data) {
    return <Spinner my="$10" />
  }

  const { subscriptions, productOwnerships } = data
  if (!subscriptions || !productOwnerships) return null
  return (
    <Container f={1} py="$8" gap="$8">
      <GithubAppMessage />

      <YStack gap="$4">
        <H2>Owned Items</H2>
        <YStack gap="$8">
          {productOwnerships?.length === 0 ? (
            <YStack gap="$1">
              <Paragraph ta="center" theme="alt1">
                You don't have any owned items.
              </Paragraph>
              <Paragraph ta="center" theme="alt2">
                You may need to refresh your page after a few seconds to see the new
                items.
              </Paragraph>
            </YStack>
          ) : (
            <YStack borderColor="$color2" borderWidth="$1" borderRadius="$4">
              <YStack p="$4" gap="$6" separator={<Separator o={0.5} />}>
                {productOwnerships.map((ownership) => {
                  return (
                    <ItemDetails key={ownership.id} type="owned_item" item={ownership} />
                  )
                })}
              </YStack>
            </YStack>
          )}
        </YStack>
      </YStack>

      <YStack gap="$4">
        <H2>Subscriptions</H2>
        <YStack gap="$8">
          {subscriptions.length === 0 && (
            <YStack gap="$1">
              <Paragraph ta="center" theme="alt1">
                You don't have any subscriptions.
              </Paragraph>
              <Paragraph ta="center" theme="alt2">
                You may need to refresh your page after a few seconds to see the new
                subscriptions.
              </Paragraph>
            </YStack>
          )}
          {subscriptions.map((sub) => {
            return <SubscriptionDetail key={sub.id} subscription={sub} />
          })}
        </YStack>
      </YStack>
    </Container>
  )
}

type SubscriptionDetailProps = {
  subscription: Exclude<
    Exclude<ReturnType<typeof useUser>['data'], undefined>['subscriptions'],
    null | undefined
  >[number]
}

const dateFormatter = Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  day: 'numeric',
})

const SubscriptionDetail = ({ subscription }: SubscriptionDetailProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const startDate = new Date(subscription.created)
  const periodEnd = new Date(subscription.current_period_end)
  const canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at) : null
  const items = getArray(subscription.subscription_items)
  const { mutate } = useSWRConfig()

  if (!items) return null

  async function handleCancelSubscription() {
    mutate(['user'])
    setIsLoading(true)
    try {
      const res = await fetch(`/api/cancel-subscription`, {
        body: JSON.stringify({
          subscription_id: subscription.id,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data = await res.json()

      // delay so stripe calls us first
      await new Promise((res) => setTimeout(() => res(true), 1000))

      await mutate('user')

      if (data.message) {
        alert(data.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleActivateSubscription() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/activate-subscription`, {
        body: JSON.stringify({
          subscription_id: subscription.id,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data = await res.json()

      // delay so stripe calls us first
      await new Promise((res) => setTimeout(() => res(true), 1000))

      await mutate('user')

      if (data.message) {
        alert(data.message)
      }
    } finally {
      setIsLoading(false)
    }
  }
  // override "trialing" cause we use it for handling several things but may get users confused so we just show "active"
  const status = subscription.status === 'trialing' ? 'active' : subscription.status

  return (
    <YStack
      borderColor="$color2"
      borderWidth="$1"
      borderRadius="$4"
      key={subscription.id}
      id={subscription.id}
      separator={<Separator />}
    >
      <YStack
        p="$4"
        theme="alt2"
        gap="$2"
        // separator={<Separator />}
        flexWrap="wrap"
      >
        <XStack gap="$2" separator={<Separator vertical my="$1" />} flexWrap="wrap">
          <SizableText>Started at {dateFormatter.format(startDate)}</SizableText>
          <SizableText>
            Current period ends at {dateFormatter.format(periodEnd)}
          </SizableText>
          {canceledAt ? (
            <SizableText>
              Canceled at {dateFormatter.format(canceledAt)} -{' '}
              <SizableText
                theme="blue_alt2"
                textDecorationLine="underline"
                cursor="pointer"
                userSelect="none"
                {...(isLoading && { opacity: 0.5 })}
                onPress={() => !isLoading && handleActivateSubscription()}
              >
                Re-Activate
              </SizableText>
            </SizableText>
          ) : (
            <SizableText
              cursor="pointer"
              userSelect="none"
              textDecorationLine="underline"
              {...(isLoading && { opacity: 0.5 })}
              onPress={() => !isLoading && handleCancelSubscription()}
            >
              Cancel Subscription
            </SizableText>
          )}
        </XStack>

        <XStack gap="$4" separator={<Separator vertical my="$1" />} flexWrap="wrap">
          <SizableText>Sub ID: {subscription.id}</SizableText>
          <SizableText>
            <SizableText>Status: </SizableText>
            <SizableText
              textTransform="capitalize"
              color={status === 'active' ? '$green9' : '$yellow9'}
            >
              {status}
            </SizableText>
          </SizableText>
        </XStack>
      </YStack>

      <YStack p="$4" gap="$6" separator={<Separator o={0.5} />}>
        {items.map((item) => {
          const product = getSingle(item.price?.products)
          if (!item.price || !product) return null
          // const product = item?.prices
          return (
            <ItemDetails
              key={`${item.price.id}-${subscription.id}`}
              item={item}
              type="subscription_item"
              subscriptionId={subscription.id}
            />
          )
        })}
      </YStack>
    </YStack>
  )
}

const ItemDetails = (
  props: {} & (
    | {
        type: 'subscription_item'
        item: Exclude<
          SubscriptionDetailProps['subscription']['subscription_items'],
          undefined | null
        >[number]
        subscriptionId: Database['public']['Tables']['subscriptions']['Row']['id']
      }
    | {
        type: 'owned_item'
        item: Exclude<UserContextType['productOwnerships'], undefined | null>[number]
      }
  )
) => {
  const { item } = props
  const router = useRouter()

  const hasDiscordInvites =
    (item.price.product?.metadata as Record<string, any>).slug === 'universal-starter'

  // const { mutate } = useSWRConfig()
  const [isLoading, setIsLoading] = useState(false)
  const product = item.price.product
  const metadata = product?.metadata as { [key: string]: Json }
  const claimLabel = metadata.claim_label ?? 'Claim'

  if (!product) {
    return null
  }
  const installInstructions = (product.metadata as any).install_instructions
  const hasGithubApp = (product.metadata as any).has_github_app

  // async function handleRemoveFormSub() {
  //   setIsLoading(true)
  //   try {
  //     const res = await fetch(`/api/remove-subscription-item`, {
  //       body: JSON.stringify({
  //         subscription_item_id: item.id,
  //       }),
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       method: 'POST',
  //     })

  //     const data = await res.json()

  //     // delay so stripe calls us first
  //     await new Promise((res) => setTimeout(() => res(true), 1000))

  //     await mutate('user')

  //     if (data.message) {
  //       alert(data.message)
  //     }
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

  async function handleGrantAccess() {
    setIsLoading(true)
    try {
      if (product?.metadata?.['claim_type'] === 'send_to_link') {
        // we just do client-side redirection
        router.push(product.metadata['usage_link'])
      } else {
        // send a request to the backend to claim
        const res = await fetch(`/api/claim`, {
          body: JSON.stringify({
            subscription_id: 'subscriptionId' in props ? props.subscriptionId : undefined,
            product_ownership_id: props.type === 'owned_item' ? props.item.id : undefined,
            product_id: product!.id,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        const data = await res.json()

        if (!res.ok) {
          alert(data?.error || `Error, response ${res.status} ${res.statusText}`)
        } else if (data.message) {
          alert(data.message)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  // const productSlug =
  //   typeof product.metadata === 'object' &&
  //   !Array.isArray(product.metadata) &&
  //   product.metadata
  //     ? product.metadata.slug
  //     : null

  return (
    <YStack key={product.id} gap="$4">
      <XStack gap="$2" jc="space-between">
        <Image
          source={{
            width: 100,
            height: 100,
            uri: product.image ?? '/guy.png',
          }}
          borderRadius="$4"
        />

        <YStack gap="$2">
          <Button
            size="$2"
            themeInverse
            onPress={() => handleGrantAccess()}
            disabled={isLoading}
            {...(isLoading && { opacity: 0.5 })}
          >
            {claimLabel}
          </Button>

          {/* <Button
            disabled={isLoading}
            {...(isLoading && { opacity: 0.5 })}
            theme="red"
            onPress={() => handleRemoveFormSub()}
            size="$2"
          >
            Remove From Sub
          </Button> */}
        </YStack>
      </XStack>

      <YStack>
        <H3>{product.name}</H3>
        <Paragraph size="$5" theme="alt2">
          {product.description}
        </Paragraph>
      </YStack>

      <YStack gap="$6" separator={<Separator o={0.5} />}>
        {installInstructions && (
          <Paragraph size="$5" theme="alt1">
            {installInstructions}
          </Paragraph>
        )}

        {hasDiscordInvites && 'subscriptionId' in props && (
          <DiscordPanel subscriptionId={props.subscriptionId} />
        )}

        {hasGithubApp && props.type === 'subscription_item' && item.id && (
          <BotInstallPanel
            subItemId={item.id.toString()}
            appInstallations={getArray(
              'app_installations' in item ? item.app_installations ?? [] : []
            )}
          />
        )}
      </YStack>
    </YStack>
  )
}

const BotInstallPanel = ({
  subItemId,
  appInstallations,
}: {
  subItemId: string
  appInstallations: Database['public']['Tables']['app_installations']['Row'][]
}) => {
  const activeInstallations = appInstallations.filter(
    (installation) => !!installation.installed_at
  )
  const installationUrl = `/api/github/install-bot?${new URLSearchParams({
    subscription_item_id: subItemId,
  })}`

  return (
    <YStack gap="$3">
      <XStack jc="space-between" gap="$2" ai="center">
        <H4>GitHub App</H4>
      </XStack>

      {activeInstallations.length > 0 ? (
        <YStack gap="$1">
          {activeInstallations.map((installation) => (
            <Paragraph>
              Installation ID: {installation.github_installation_id} -{' '}
              <Link
                style={{ textDecoration: 'underline' }}
                target="_blank"
                href={`https://github.com/settings/installations/${installation.github_installation_id}`}
              >
                Installation Settings
              </Link>
            </Paragraph>
          ))}
        </YStack>
      ) : (
        <>
          <Notice my={0}>
            No install found. To receive updates, install the Takeout GitHub Bot on your
            repo. If you have already installed the bot and don't see it here, uninstall
            the bot from GitHub, then come back to this page and try again.
          </Notice>
        </>
      )}

      <XStack>
        <ButtonLink href={installationUrl} themeInverse>
          Install GitHub App
        </ButtonLink>
      </XStack>
    </YStack>
  )
}

const DiscordPanel = ({ subscriptionId }: { subscriptionId: string }) => {
  const groupInfoSwr = useSWR<DiscordChannelStatus>(
    `/api/discord/channel?${new URLSearchParams({ subscription_id: subscriptionId })}`,
    (url) =>
      fetch(url, { headers: { 'Content-Type': 'application/json' } }).then((res) =>
        res.json()
      )
  )
  const [draftQuery, setDraftQuery] = useState('')
  const [query, setQuery] = useState(draftQuery)
  const searchSwr = useSWR<RESTGetAPIGuildMembersSearchResult>(
    query
      ? `/api/discord/search-member?${new URLSearchParams({ query }).toString()}`
      : null,
    (url) =>
      fetch(url, { headers: { 'Content-Type': 'application/json' } }).then((res) =>
        res.json()
      )
  )

  const resetChannelMutation = useSWRMutation(
    [`/api/discord/channel`, 'DELETE', subscriptionId],
    (url) =>
      fetch(`/api/discord/channel`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscriptionId,
        }),
      }).then((res) => res.json()),
    {
      onSuccess: async () => {
        await mutate(
          `/api/discord/channel?${new URLSearchParams({
            subscription_id: subscriptionId,
          })}`
        )
        setDraftQuery('')
        setQuery('')
      },
    }
  )

  const handleSearch = async () => {
    setQuery(draftQuery)
  }

  return (
    <YStack gap="$3">
      <XStack jc="space-between" gap="$2" ai="center">
        <H4>
          Discord Access{' '}
          {!!groupInfoSwr.data &&
            `(${groupInfoSwr.data?.currentlyOccupiedSeats}/${groupInfoSwr.data?.discordSeats})`}
        </H4>

        <Button
          size="$2"
          onPress={() => resetChannelMutation.trigger()}
          disabled={resetChannelMutation.isMutating}
        >
          {resetChannelMutation.isMutating ? 'Resetting...' : 'Reset'}
        </Button>
      </XStack>

      <Form onSubmit={handleSearch} gap="$2" flexDirection="row" ai="flex-end">
        <Fieldset>
          <Label size="$3" theme="alt1" htmlFor="discord-username">
            Username / Nickname
          </Label>
          <Input
            miw={200}
            placeholder="Your username..."
            id="discord-username"
            value={draftQuery}
            onChangeText={setDraftQuery}
          />
        </Fieldset>

        <Form.Trigger>
          <Button icon={Search}>Search</Button>
        </Form.Trigger>
      </Form>

      <XStack tag="article">
        <Paragraph size="$3" theme="alt1">
          Note: You must{' '}
          <NextLink target="_blank" href="https://discord.gg/4qh6tdcVDa">
            join the Discord server
          </NextLink>{' '}
          first so we can find your username.
        </Paragraph>
      </XStack>

      <YStack gap="$2">
        {searchSwr.data?.map((member) => {
          return (
            <DiscordMember
              key={member.user?.id}
              member={member}
              subscriptionId={subscriptionId}
            />
          )
        })}
      </YStack>
    </YStack>
  )
}

const DiscordMember = ({
  member,
  subscriptionId,
}: {
  member: APIGuildMember
  subscriptionId: string
}) => {
  const { data, error, isMutating, trigger } = useSWRMutation(
    ['/api/discord/channel', 'POST', member.user?.id],
    async () => {
      const res = await fetch('/api/discord/channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          discord_id: member.user?.id,
        }),
      })

      if (res.status < 200 || res.status > 299) {
        throw await res.json()
      }
      return await res.json()
    },
    {
      onSuccess: async () => {
        await mutate(
          `/api/discord/channel?${new URLSearchParams({
            subscription_id: subscriptionId,
          })}`
        )
      },
    }
  )

  const name = member.nick || member.user?.global_name

  const username = `${member.user?.username}${
    member.user?.discriminator !== '0' ? `#${member.user?.discriminator}` : ''
  }`
  const avatarSrc = member.user?.avatar
    ? `https://cdn.discordapp.com/avatars/${member.user?.id}/${member.user?.avatar}.png`
    : null
  return (
    <XStack gap="$2" ai="center" flexWrap="wrap">
      <Button minWidth={70} size="$2" disabled={isMutating} onPress={() => trigger()}>
        {isMutating ? 'Inviting...' : 'Add'}
      </Button>
      <Avatar circular size="$2">
        <Avatar.Image accessibilityLabel={`avatar for ${username}`} src={avatarSrc!} />
        <Avatar.Fallback backgroundColor="$blue10" />
      </Avatar>
      <Paragraph>{`${username}${name ? ` (${name})` : ''}`}</Paragraph>
      {data && (
        <Paragraph size="$1" theme="green_alt2">
          {data.message}
        </Paragraph>
      )}
      {error && (
        <Paragraph size="$1" theme="red_alt2">
          {error.message}
        </Paragraph>
      )}
    </XStack>
  )
}

const GithubAppMessage = () => {
  const router = useRouter()
  const githubAppInstalled = !!router.query.github_app_installed
  if (!githubAppInstalled) return null
  return <Paragraph theme="green_alt2"></Paragraph>
}

Page.getLayout = getDefaultLayout
